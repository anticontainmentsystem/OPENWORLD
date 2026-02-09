/**
 * ConfirmModal.js
 * A promise-based, theme-compliant modal replacement for confirm()
 */

const COLORS = {
  copper: { border: '#b87333', title: '#c4885c', btn: '#b87333' },
  moss: { border: '#4a6741', title: '#6b8b61', btn: '#4a6741' }
};

export const ConfirmModal = {
  show({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', theme = 'copper' }) {
    return new Promise((resolve) => {
      // Remove existing if any (singleton pattern)
      const existing = document.querySelector('.confirm-modal-overlay');
      if (existing) existing.remove();

      const colors = COLORS[theme] || COLORS.copper;

      // Create Overlay with inline styles
      const overlay = document.createElement('div');
      overlay.className = 'confirm-modal-overlay';
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        background: 'rgba(0, 0, 0, 0.85)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      });
      
      // Create Modal with inline styles
      const modal = document.createElement('div');
      modal.className = `confirm-modal confirm-modal--${theme}`;
      Object.assign(modal.style, {
        background: '#141412',
        border: `2px solid ${colors.border}`,
        borderRadius: '3px',
        width: '340px',
        maxWidth: '90%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      });
      
      modal.innerHTML = `
        <div style="padding: 12px 16px; background: #0c0c0a; border-bottom: 1px solid #252520;">
          <h3 style="margin: 0; font-size: 1rem; font-weight: 600; color: ${colors.title};">${title}</h3>
        </div>
        <div style="padding: 16px; color: #8a8880; font-size: 0.9rem; line-height: 1.5;">
          <p style="margin: 0;">${message}</p>
        </div>
        <div style="padding: 12px 16px; display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #252520; background: #0c0c0a;">
          <button id="confirmCancel" style="padding: 6px 14px; font-size: 0.85rem; background: transparent; border: 1px solid #252520; color: #8a8880; border-radius: 3px; cursor: pointer;">${cancelText}</button>
          <button id="confirmProceed" style="padding: 6px 14px; font-size: 0.85rem; background: ${colors.btn}; border: none; color: #fff; border-radius: 3px; cursor: pointer;">${confirmText}</button>
        </div>
      `;
      
      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      const cancelBtn = modal.querySelector('#confirmCancel');
      const proceedBtn = modal.querySelector('#confirmProceed');
      
      cancelBtn.focus();
      
      // Handlers
      const cleanup = () => {
        overlay.remove();
      };
      
      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
      
      proceedBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      
      // Prevent click-away (Blocking)
      overlay.onclick = (e) => {
        if (e.target === overlay) {
            modal.style.transform = 'scale(1.02)';
            setTimeout(() => modal.style.transform = '', 100);
        }
      };
      
      // Escape key
      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', keyHandler);
          cleanup();
          resolve(false);
        }
      };
      document.addEventListener('keydown', keyHandler);
    });
  }
};
